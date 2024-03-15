import Login from './LoginRegister/Login';
import Register from './LoginRegister/Register';
import Presentation from './Presentation/Presentation';
import Footer from '../Footer/Footer';
import './Home.scss';

function Home() {
	return (
		<div className="home">
			<Login />
			<Register />
			<Presentation />
			<Footer />
		</div>
	);
}

export default Home;