//import { Outlet } from "react-router-dom";
import Header from '../../components/Header/Header';
import Home from '../../components/Home/Home';
import './Root.scss';

function Root() {
    return (
        <div className="root">
            <Header /> 
            <Home />     
        </div>
    );
}

export default Root;
