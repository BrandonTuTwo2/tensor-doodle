import './App.css'
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl"
import Webcam from 'react-webcam';
import { useEffect, useRef, useState } from 'react';

import { GestureDescription, Finger, FingerCurl, GestureEstimator } from "fingerpose";


/*function Test() {
  const [res,setRes] = useState('');
  useEffect(() => {
    fetch("/api/test", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        setRes(data.test);
        console.log("HI");
        console.log(data);
      })
      .catch((error) => console.log(error));
  }, []);
  return res
}*/

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
//rest of the fingies
for (const finger of [Finger.Middle, Finger.Pinky, Finger.Ring, Finger.Thumb]) {
  pointerGesture.addCurl(finger, FingerCurl.FullCurl, 1.0);
}


function App() {
  const webCamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  //does this need to be an array?
  const gestureEstimator = new GestureEstimator([pointerGesture])
  console.log("seems good so far");
  console.log(gestureEstimator);

  const loadHandPose = async () => {
    const model = await handpose.load();


    const detect = async (model: handpose.HandPose) => {
      if (typeof webCamRef.current !== "undefined" && webCamRef.current !== null && webCamRef.current.video?.readyState === 4) {
        const videoFeed = webCamRef.current.video;
        const vidWidth = webCamRef.current.video.videoWidth;
        const vidHeight = webCamRef.current.video.videoHeight;

        webCamRef.current.video.width = vidWidth;
        webCamRef.current.video.height = vidHeight;

        if (canvasRef.current == null) return;
        canvasRef.current.width = vidWidth;
        canvasRef.current.height = vidHeight;

        const predictions = await model.estimateHands(videoFeed, true);
        const ctx = canvasRef.current.getContext("2d");
        if (ctx == null) return;
        ctxRef.current = ctx



        //only draw hand when its actually present
        if (predictions[0] !== undefined) {
          //pointer detection
          const gestureEstimation = gestureEstimator.estimate(predictions[0].landmarks, 5);

          if (gestureEstimation.gestures.length > 0) {
            //console.log("Pointer is present?");
            //console.log(gestureEstimation);
            // 8 is the top of the pointer finger 
            const landmarks = predictions[0].landmarks
            const xCord = landmarks[8][0]
            const yCord = landmarks[8][1]

            ctxRef.current.beginPath();
            ctxRef.current.moveTo(xCord, yCord);
            setIsPressed(true);
            
            //console.log(`X:${xCord} Y:${yCord}`);
            startDrawingFinger(xCord, yCord);

          } else {
            console.log("DONE");
            ctxRef.current.closePath();
            setIsPressed(false);
          }

          drawHand(predictions);
        }
      }
    }

    setInterval(() => {
      detect(model)
    }, 100)
  }


  const startDrawing = (e: { nativeEvent: { offsetX: number; offsetY: number; }; }) => {
    if (ctxRef.current == null) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX,
      e.nativeEvent.offsetY);
    setIsPressed(true);
    //console.log(e)
  };

  const startDrawingFinger = (offsetX: number, offsetY: number) => {
    if (!isPressed) return;
    if (ctxRef.current == null) return;
    console.log("HI");
    console.log(`X:${offsetX} Y:${offsetY}`);
    ctxRef.current.lineTo(offsetX,offsetY)
    ctxRef.current.lineCap = "round";
    ctxRef.current.strokeStyle = "black";
    ctxRef.current.lineWidth = 5;
    ctxRef.current.stroke();
    //ctxRef.current.closePath();

  }

  const endDrawing = () => {
    ctxRef.current?.closePath();
    setIsPressed(false);

  };

  const updateDrawing = (e: { nativeEvent: { offsetX: number; offsetY: number; }; }) => {
    if (!isPressed) return;

    ctxRef.current?.lineTo(e.nativeEvent.offsetX,
      e.nativeEvent.offsetY)
    ctxRef.current?.stroke();
  };

  const clear = () => {
    if (ctxRef.current == null) return;
    if (canvasRef.current == null) return;

    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  const drawHand = (predictions: handpose.AnnotatedPrediction[]) => {
    if (predictions.length > 0) {
      predictions.forEach(prediction => {
        const landmarks = prediction.landmarks;

        /*for (let j = 0; j < Object.keys(fingerJoints).length; j++) {
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
        }*/
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
    const canvas = canvasRef.current;
    if (canvas == null) return;
    //canvas.width = 900 //im probably going to make it based on the window size
    //canvas.height = 900 //ditto
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx
  }, [])

  loadHandPose();

  return (
    <>
      <h1>Tensor Doodle ✏️</h1>
      <button id="clearBtn" className='mt-3 mb-3' onClick={clear}>Clear</button>
      <Webcam ref={webCamRef} style={{
        position: "absolute",
        marginLeft: "auto",
        marginRight: "auto",
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 9,
        width: "0%",
        height: "0%",
      }}
        videoConstraints={{
          width: 720,
          height: 560,
          facingMode: "user",
        }} />
      <canvas ref={canvasRef} style={{
        position: "absolute",
        marginLeft: "auto",
        marginRight: "auto",
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 20,
        width: 720,
        height: 560,
      }} /*onMouseDown={startDrawing} onMouseMove={updateDrawing} onMouseUp={endDrawing} */ />
    </>
  )
}

export default App
