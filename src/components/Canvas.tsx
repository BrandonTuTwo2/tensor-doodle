import { useEffect, useRef, useState } from 'react';

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isPressed,setIsPressed] = useState(false);

  const startDrawing = (e) => {
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

  const updateDrawing = (e) => { 
    if(!isPressed) return;

    ctxRef.current?.lineTo(e.nativeEvent.offsetX,
      e.nativeEvent.offsetY)
    ctxRef.current?.stroke();
  };

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
  return (
    <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={updateDrawing} onMouseUp={endDrawing} />
  )

}
