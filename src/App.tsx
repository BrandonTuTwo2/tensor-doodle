import './App.css'
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl"
import Webcam from 'react-webcam';
import { useEffect, useRef, useState } from 'react';
import { GestureDescription, Finger, FingerCurl, GestureEstimator } from "fingerpose";


let counter  = 0;

// Points for fingers
const fingerJoints = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
};

//Putting this here for now but I should probably move this to its own file eventually
const pointerGesture = new GestureDescription('pointer');
//index no curl
pointerGesture.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
pointerGesture.addCurl(Finger.Index, FingerCurl.HalfCurl, -1.0);
pointerGesture.addCurl(Finger.Index, FingerCurl.FullCurl, -1.0);

//rest of the fingies
for (const finger of [Finger.Middle, Finger.Pinky, Finger.Ring, Finger.Thumb]) {
  pointerGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}


function App() {
  const webCamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCtxRef  = useRef<CanvasRenderingContext2D | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  let isRunning = true


  //does this need to be an array?
  const gestureEstimator = new GestureEstimator([pointerGesture])
  const handPoseConfig = {
    maxContinuousChecks: 15,
    detectionConfidence: 0.95,
    //iouThreshold: ;
    scoreThreshold: 0.9,
  }

  const loadHandPose = async () => {
    const model = await handpose.load(handPoseConfig);
    //console.log("MODEL HAS LOADED");
    //console.log(model)

    if (typeof webCamRef.current !== "undefined" && webCamRef.current !== null && webCamRef.current.video?.readyState === 4) {
      const vidWidth = webCamRef.current.video.videoWidth;
      const vidHeight = webCamRef.current.video.videoHeight;

      //I only need to map this once, thi is what prevents from disapearing, might not even need the second canvas
      if (canvasRef.current == null || drawingCanvasRef.current == null) return;
      drawingCanvasRef.current.width = vidWidth;
      drawingCanvasRef.current.height = vidHeight;
    }


    const detect = async (model: handpose.HandPose) => {
      if (typeof webCamRef.current !== "undefined" && webCamRef.current !== null && webCamRef.current.video?.readyState === 4) {
        const videoFeed = webCamRef.current.video;
        const vidWidth = webCamRef.current.video.videoWidth;
        const vidHeight = webCamRef.current.video.videoHeight;
  
        webCamRef.current.video.width = vidWidth;
        webCamRef.current.video.height = vidHeight;
        
  
        //This is whats making the drawings dissapear but also mapping the hand positions
        if (canvasRef.current == null || drawingCanvasRef.current == null) return;
        canvasRef.current.width = vidWidth;
        canvasRef.current.height = vidHeight;


        const predictions = await model.estimateHands(videoFeed, true);
        
        if(canvasRef.current === null) return;
        const ctx = canvasRef.current.getContext("2d");
        if (ctx == null) return;
        ctxRef.current = ctx



        //only draw hand when its actually present
        if (predictions[0] !== undefined) {
          //pointer detection
          const gestureEstimation = gestureEstimator.estimate(predictions[0].landmarks, 5);
          
          if (gestureEstimation.gestures.length > 0) {
            ////console.log("Pointer is present?");
            ////console.log(gestureEstimation);
            // 8 is the top of the pointer finger 
            const landmarks = predictions[0].landmarks
            const xCord = landmarks[8][0]
            const yCord = landmarks[8][1]
            counter += 1
            if(drawingCtxRef.current === null) return;
            if(isRunning) {
              drawingCtxRef.current.beginPath();
              drawingCtxRef.current.moveTo(xCord, yCord);
              //its not setting to true?
              setIsPressed(true);
              isRunning = false;
            }

            ////console.log(`HERE IS ISPRESSED ${isPressed}`);
            ////console.log(`X:${xCord} Y:${yCord}`);
            if(counter == 7){
              startDrawingFinger(xCord, yCord);
              counter = 0;
            }
          } else {
            //console.log("DONE");
            if(drawingCtxRef.current === null) return;
            //console.log("CLOSED");
            drawingCtxRef.current.closePath();
            setIsPressed(false);
            isRunning = true;
            counter = 0;
          }

          drawHand(predictions);
        }
      }
    }

    setInterval(() => {
      detect(model)
    }, 28.571428571428573)
  }


  const startDrawing = (e: { nativeEvent: { offsetX: number; offsetY: number; }; }) => {
    if (drawingCtxRef.current == null) return;
    drawingCtxRef.current.beginPath();
    drawingCtxRef.current.moveTo(e.nativeEvent.offsetX,
      e.nativeEvent.offsetY);
    setIsPressed(true);
    ////console.log(e)
  };

  const startDrawingFinger = (offsetX: number, offsetY: number) => {
    ////console.log(`HERE IS ISPRESSED ${isPressed}`);
    //if (!isPressed) return;
    if (drawingCtxRef.current == null) return;
    //console.log(`X:${offsetX} Y:${offsetY}`);
    drawingCtxRef.current.lineCap = "round";
    drawingCtxRef.current.strokeStyle = "black";
    drawingCtxRef.current.lineWidth = 5;
    drawingCtxRef.current.lineTo(offsetX,offsetY)
    drawingCtxRef.current.stroke();
    //drawingCtxRef.current.arc(offsetX, offsetY, 5, 0, 3 * Math.PI);
    //drawingCtxRef.current.fill()
    //ctxRef.current.closePath();

  }

  const endDrawing = () => {
    
    drawingCtxRef.current?.closePath();
    setIsPressed(false);

  };

  const updateDrawing = (e: { nativeEvent: { offsetX: number; offsetY: number; }; }) => {
    if (!isPressed) return;

    drawingCtxRef.current?.lineTo(e.nativeEvent.offsetX,
      e.nativeEvent.offsetY)
      drawingCtxRef.current?.stroke();
  };

  const clear = () => {
    if (drawingCtxRef.current == null) return;
    if (drawingCanvasRef.current == null) return;

    drawingCtxRef.current.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
  }

  const drawHand = (predictions: handpose.AnnotatedPrediction[]) => {
    if (predictions.length > 0) {
      predictions.forEach(prediction => {
        const landmarks = prediction.landmarks;

        for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
          const finger = Object.keys(fingerJoints)[j];

          //hand lines
          //  Loop through pairs of joints
          for (let k = 0; k < fingerJoints[finger].length - 1; k++) {
            // Get pairs of joints
            const firstJointIndex = fingerJoints[finger][k];
            const secondJointIndex = fingerJoints[finger][k + 1];

            if (ctxRef.current === null) return;
            // Draw path
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(
              landmarks[firstJointIndex][0],
              landmarks[firstJointIndex][1]
            );
            ctxRef.current.lineTo(
              landmarks[secondJointIndex][0],
              landmarks[secondJointIndex][1]
            );
            ctxRef.current.strokeStyle = "plum";
            ctxRef.current.lineWidth = 4;
            ctxRef.current.stroke();
          }
        }
        
        for (let i = 0; i < landmarks.length; i++) {
          const x = landmarks[i][0];
          const y = landmarks[i][1];
          if (ctxRef.current === null) return;
          ctxRef.current.beginPath();
          ctxRef.current.arc(x, y, 5, 0, 3 * Math.PI);
          if (i == 8) {
            ctxRef.current.fillStyle = "red";
          } else {
            ctxRef.current.fillStyle = "indigo";
          }
          ctxRef.current.fill()
        }

      });
    }
  }




  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (canvas == null) return;
    const ctx = canvas.getContext("2d");
    if (ctx == null) return;
    drawingCtxRef.current = ctx;

  },[] )
  loadHandPose();

  return (
    <>
      <div className='absolute top-0 left-0 right-0'>
        <h1 >Tensor Doodle ✏️</h1>
        <button id="clearBtn" className='mt-3 mb-3' onClick={clear}>Clear</button>
      </div>
      <Webcam ref={webCamRef} style={{
        position: "absolute",
        margin: "auto",
        display: "block",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        textAlign: "center",
        zIndex: 11,
        width: 0,
        height: 0,
      }}
        videoConstraints={{
          width: 998,
          height: 698,
          facingMode: "user",
        }} />
      <canvas ref={canvasRef} style={{
        position: "absolute",
        margin: "auto",
        display: "block",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        textAlign: "center",
        zIndex: 999,
        width: 998,
        height: 698,
      }} /*onMouseDown={startDrawing} onMouseMove={updateDrawing} onMouseUp={endDrawing}*//>

  <canvas ref={drawingCanvasRef} style={{
          position: "absolute",
          margin: "auto",
          display: "block",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          textAlign: "center",
          zIndex: 999,
          width: 998,
          height: 698,
        }} onMouseDown={startDrawing} onMouseMove={updateDrawing} onMouseUp={endDrawing}/>
      </>
  )
}

export default App
