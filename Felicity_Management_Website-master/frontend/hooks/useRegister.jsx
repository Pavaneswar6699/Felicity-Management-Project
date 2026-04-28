import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";

export const useRegister = ()=>{
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(null);
    const { dispatch } = useAuthContext();

    const register=async(email, password, firstName, lastName, participantType, collegeName)=>{
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.PARTICIPANT.REGISTER, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, firstName, lastName, participantType, collegeName})
        });

        const jsondata = await response.json();
        if(!response.ok){
            setIsLoading(false);
            setError(jsondata.error);
            return null;
        }else{
            // save participant jwt to local storage
            localStorage.setItem('participant', JSON.stringify(jsondata));
            localStorage.setItem('participantOnboardingPending', 'true');
            // update auth context
            dispatch({type: 'LOGIN', payload: jsondata});
            setIsLoading(false);
            return jsondata;
        }
    }

    return {register, isLoading, error};
}