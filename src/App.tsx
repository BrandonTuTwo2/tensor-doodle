import './App.css'
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl"
import Webcam from 'react-webcam';
import { useEffect, useRef, useState } from 'react';


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

function App() {
  const webCamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const loadHandPose = async () =>{
    const model = await handpose.load();


    const detect = async (model: handpose.HandPose) => {
      if(typeof webCamRef.current !== "undefined" && webCamRef.current !== null && webCamRef.current.video?.readyState === 4) {
        const videoFeed = webCamRef.current.video;
        const vidWidth = webCamRef.current.video.videoWidth;
        const vidHeight = webCamRef.current.video.videoHeight;

        webCamRef.current.video.width = vidWidth;
        webCamRef.current.video.height = vidHeight;

        const predictions = await model.estimateHands(document.querySelector("video"));
        console.log(predictions);
        drawHand(predictions);
      }
    }

    setInterval(() =>{
      detect(model)
    },100)
  }


  const startDrawing = (e: { nativeEvent: { offsetX: number; offsetY: number; }; }) => {
    if (ctxRef.current == null) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.nativeEvent.offsetX,
      e.nativeEvent.offsetY);
    setIsPressed(true);
    //console.log(e)
  };

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
    if(ctxRef.current == null) return;
    if(canvasRef.current == null) return;

    ctxRef.current.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
  }

  const drawHand = (predictions: handpose.AnnotatedPrediction[]) => {
    if(predictions.length > 0) {
      predictions.forEach(prediction => {
        const landmarks = prediction.landmarks;
        for (let i = 0;i < landmarks.length;i++){
          const x = landmarks[i][0];
          const y = landmarks[i][0]
          if (ctxRef.current == null) return;
          ctxRef.current.beginPath();
          ctxRef.current.arc(x,y,5,0,3* Math.PI);

          ctxRef.current.fillStyle = "indigo";
          ctxRef.current.fill()
        }
        
      });
    }
  }




  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) return;
    canvas.width = 900 //im probably going to make it based on the window size
    canvas.height = 800 //ditto

    const ctx = canvas.getContext("2d");
    if (ctx == null) return;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctxRef.current = ctx
  }, [])

  loadHandPose();

  return (
    <>
      <h1>Tensor Doodle ✏️</h1>
      <Webcam ref={webCamRef} 
      style={{
        width:400,
        height:400
      }}/>
      <div>
      <button id="clearBtn" className='mt-3 mb-3' onClick={clear}>Clear</button>
      <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={updateDrawing} onMouseUp={endDrawing} />
    </div>
    </>
  )
}

export default App
