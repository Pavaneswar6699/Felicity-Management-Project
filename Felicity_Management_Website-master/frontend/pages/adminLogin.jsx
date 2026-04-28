import { useState } from "react";
import { useAdminLogin } from "../hooks/useAdminLogin";
import { ALoginForm } from "../components/adminloginform";

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAdminLogin();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
    }

    return (
        <ALoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
        />
    );
};

export default AdminLogin;