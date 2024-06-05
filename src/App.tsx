import './App.css'
import Canvas from './components/Canvas'
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
  return (
    <>
      <h1>Tensor Doodle ✏️</h1>
      <Canvas />
    </>
  )
}

export default App
