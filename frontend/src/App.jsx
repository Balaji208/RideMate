
import { BrowserRouter } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element = {<Home/>}/>
          <Route path="/dashboar" element = {<Dashboard/>} />
        </Routes>
      </BrowserRouter>
     </>
  )
}

export default App
