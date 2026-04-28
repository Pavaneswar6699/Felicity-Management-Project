import { useAuthContext } from "./useAuthContext";
import { useEventsContext } from "./useEventsContext";
import { useNavigate } from 'react-router-dom';

export const useLogout = () => {
    const { dispatch } = useAuthContext();
    const { dispatch: eventsDispatch } = useEventsContext();
    const navigate = useNavigate();
    
    const logout=()=>{
        // remove participant, organizer, and admin from local storage
        localStorage.removeItem('participant');
        localStorage.removeItem('organizer');
        localStorage.removeItem('admin');
        // update auth context to dispatch logout action
        dispatch({type: 'LOGOUT'});
        eventsDispatch({type: 'SET_EVENTS', payload: null}); // clear events from context on logout
        // redirect to standard login page
        navigate('/login');
    }
    return { logout };
}