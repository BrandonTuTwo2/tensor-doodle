import './App.css'
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl"
import Webcam from 'react-webcam';
import Canvas from './components/Canvas'
import { useRef } from 'react';
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
  const webCamRef = useRef(null);

  const loadHandPose = async () =>{
    const model = await handpose.load();
    const predictions = await model.estimateHands(document.querySelector("video"));
    if (predictions.length > 0) {
      /*
      `predictions` is an array of objects describing each detected hand, for example:
      [
        {
          handInViewConfidence: 1, // The probability of a hand being present.
          boundingBox: { // The bounding box surrounding the hand.
            topLeft: [162.91, -17.42],
            bottomRight: [548.56, 368.23],
          },
          landmarks: [ // The 3D coordinates of each hand landmark.
            [472.52, 298.59, 0.00],
            [412.80, 315.64, -6.18],
            ...
          ],
          annotations: { // Semantic groupings of the `landmarks` coordinates.
            thumb: [
              [412.80, 315.64, -6.18]
              [350.02, 298.38, -7.14],
              ...
            ],
            ...
          }
        }
      ]
      */
  
      for (let i = 0; i < predictions.length; i++) {
        const keypoints = predictions[i].landmarks;
  
        // Log hand keypoints.
        for (let i = 0; i < keypoints.length; i++) {
          const [x, y, z] = keypoints[i];
          console.log(`Keypoint ${i}: [${x}, ${y}, ${z}]`);
        }
      }
    }
    console.log("LOADED?");
  }

  loadHandPose();


  return (
    <>
      <h1>Tensor Doodle ✏️</h1>
      <Webcam ref={webCamRef} 
      style={{
        width:400,
        height:400
      }}/>
      <Canvas />
    </>
  )
}

export default App
