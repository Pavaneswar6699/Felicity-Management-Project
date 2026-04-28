import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRegister } from "../hooks/useRegister";
import { PRegisterForm } from "../components/participantregisterform";

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [participantType, setParticipantType] = useState('IIIT');
    const [collegeName, setCollegeName] = useState('');

    const { register, isLoading, error } = useRegister();
    const navigate = useNavigate();

    const handleSubmit = async(e) => {
        e.preventDefault();
        const result = await register(email, password, firstName, lastName, participantType, collegeName);
        if (result) {
            navigate('/participantOnboarding');
        }
    }

    return (<PRegisterForm 
        firstName={firstName} setFirstName={setFirstName}
        lastName={lastName} setLastName={setLastName}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        participantType={participantType} setParticipantType={setParticipantType}
        collegeName={collegeName} setCollegeName={setCollegeName}
        isLoading={isLoading}
        error={error}
        handleSubmit={handleSubmit}
        />);
}

export default Register;