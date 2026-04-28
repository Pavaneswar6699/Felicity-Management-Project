import { createContext, useReducer, useEffect } from "react";

export const AuthContext = createContext();

export const authReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN":
            return {
                participant: action.payload
            }
        case "ORGANIZER_LOGIN":
            return {
                organizer: action.payload
            }
        case "ADMIN_LOGIN":
            return {
                admin: action.payload
            }
        case "LOGOUT":
            return {
                participant: null,
                organizer: null,
                admin: null
            }
        default:
            return state;
    }
}

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        participant: null,
        organizer: null,
        admin: null
    });
    useEffect(() => {
        const participant = JSON.parse(localStorage.getItem('participant'));
        const organizer = JSON.parse(localStorage.getItem('organizer'));
        const admin = JSON.parse(localStorage.getItem('admin'));
        if (participant) {
            dispatch({ type: 'LOGIN', payload: participant });
        }
        else if (organizer) {
            dispatch({ type: 'ORGANIZER_LOGIN', payload: organizer });
        }
        else if (admin) {
            dispatch({ type: 'ADMIN_LOGIN', payload: admin });
        }
    }, []);
    console.log("AuthContext state:", state); // Log the current state to debug

    return (
        <AuthContext.Provider value={{ ...state, dispatch }}>
            {children}
        </AuthContext.Provider>
    )
}