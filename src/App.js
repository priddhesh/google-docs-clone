import logo from './logo.svg';
import './App.css';
import Editor from './components/Editor';
import Login from './components/Login';
import Register from './components/Register';
import RequestAccess from './components/RequestAccess';
import { BrowserRouter as Router,Routes,Route, Navigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import DocState from './context/DocState';
function App() {
  return (
    <>
    <DocState>
    <Router>
      <Routes>
        <Route path='/docs' element={<Navigate replace to={`/docs/${uuid()}`}/>}/>
        <Route path='/docs/:id' element={<Editor/>}/>
        <Route path='/' element={<Login/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/requestaccess' element={<RequestAccess/>}/>
      </Routes>
    </Router>
    </DocState>
    </>
  );
}

export default App;
