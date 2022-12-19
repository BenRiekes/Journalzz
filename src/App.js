import { Route, Routes } from "react-router-dom"; 
import Navbar from "./components/Navbar";
import News from "./pages/News"; 
import Profile from "./pages/Profile";
import View from "./pages/View"; 
import ViewProfile from "./pages/ViewProfile";

function App() {
  
  return (

    <>
      <Navbar />

      <div className = "container">

        <Routes>

          <Route path = "/" element = {<News />} />
         
          <Route path = "/Profile" element = {<Profile />} />
          <Route path = "/View/:article" element = {<View />} />
          <Route path = "/ViewProfile/:user" element = {<ViewProfile />} />
        </Routes>
        
      </div>
    </>
  )
}

export default App;
