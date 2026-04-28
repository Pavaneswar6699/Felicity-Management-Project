import { useState } from "react";
import { useParticipantLogin } from "../hooks/useParticipantLogin";
import { useOrganizerLogin } from "../hooks/useOrganizerLogin";
import { PLoginForm } from "../components/participantloginform";
import { OLoginForm } from "../components/organizerloginform";

const Login = () => {
    const [loginType, setLoginType] = useState('Participant');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [participantType, setParticipantType] = useState('IIIT');

    const { participantLogin, isLoading, error } = useParticipantLogin();
    const { login, isLoading: organizerLoading, error: organizerError } = useOrganizerLogin();

    const handleParticipantSubmit = async (e) => {
        e.preventDefault();
        await participantLogin(email, password, participantType);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
    }

    return (
        <>
            <form className="Select-login-type">
                <h2>Select Login Type</h2>
                <div className="login-type-buttons">
                    <label className={loginType === 'Participant' ? 'active' : ''}>
                        <input type="radio" name="loginType" value="Participant" checked={loginType === 'Participant'} onChange={() => setLoginType('Participant')} />
                        Participant
                    </label>
                    <label className={loginType === 'Organizer' ? 'active' : ''}>
                        <input type="radio" name="loginType" value="Organizer" checked={loginType === 'Organizer'} onChange={() => setLoginType('Organizer')} />
                        Organizer
                    </label>
                </div>
            </form>
            {loginType === 'Participant' && (<PLoginForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} participantType={participantType} setParticipantType={setParticipantType} handleParticipantSubmit={handleParticipantSubmit} isLoading={isLoading} error={error} />)}
            {loginType === 'Organizer' && (<OLoginForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} handleSubmit={handleSubmit} organizerLoading={organizerLoading} organizerError={organizerError} />)}
            <div className="admin-login-link">
                <span className="adminlogin"><a href="/adminLogin"><img src="/discoholic-disco.gif" height="40" alt="Admin Login"/></a></span>
            </div>
        </>
    )
}

export default Login;