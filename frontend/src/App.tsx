import logo from '/favicon.png'
import './App.css'

function App() {
  return (
    <>
      <div>
        <a href="https://www.metacell.us/" target="_blank">
          <img src={logo} className="logo" alt="Logo" />
        </a>
      </div>
      <h1>Vite + React + Typescript</h1>
      <div className="card">
        <p>
          Hello World
        </p>
      </div>
    </>
  )
}

export default App
