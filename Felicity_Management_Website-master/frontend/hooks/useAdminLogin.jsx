import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import { useNavigate } from "react-router-dom";
import API_ENDPOINTS from "../src/config/apiConfig";

export const useAdminLogin = ()=>{
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(null);
    const { dispatch } = useAuthContext();
    const navigate = useNavigate();

    const login=async(email, password)=>{
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.ADMIN.LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });

        const jsondata = await response.json();
        if(!response.ok){
            setIsLoading(false);
            setError(jsondata.error);
        }else{
            // save admin jwt to local storage
            localStorage.setItem('admin', JSON.stringify(jsondata));
            // update auth context
            dispatch({type: 'ADMIN_LOGIN', payload: jsondata});
            setIsLoading(false);
            // redirect to admin home
            navigate('/adminHome');
        }
    }

    return {login, isLoading, error};
}