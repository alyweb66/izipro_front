import { Link } from 'react-router-dom';
import './Login.scss';

function Login() {
    return (
        <div className='login-container'>
            <p className='title'> Se connecter</p>
            <div className='input-container'>
                <input type="email" className='input' placeholder='Email' />
                <input type="password" className='input' placeholder='Password' />
            </div>
            <Link to={'/Forgot'} className='link'>Mot de passe oublié?</Link>
            <button className='button'>Se connecter</button>

        </div>
    );
}

export default Login;