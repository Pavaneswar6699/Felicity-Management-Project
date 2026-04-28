import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import API_ENDPOINTS from "../src/config/apiConfig";

export const useParticipantLogin = ()=>{
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(null);
    const { dispatch } = useAuthContext();

    const participantLogin=async(email, password, participantType)=>{
        setIsLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINTS.PARTICIPANT.LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, participantType})
        });

        const jsondata = await response.json();
        if(!response.ok){
            setIsLoading(false);
            setError(jsondata.error);
        }else{
            // save participant jwt to local storage
            localStorage.setItem('participant', JSON.stringify(jsondata));
            // update auth context
            dispatch({type: 'LOGIN', payload: jsondata});
            setIsLoading(false);
        }
    }

    return {participantLogin, isLoading, error};
}