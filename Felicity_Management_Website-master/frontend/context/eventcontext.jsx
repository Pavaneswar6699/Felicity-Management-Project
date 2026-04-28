import { createContext, useReducer } from "react";

export const EventsContext=createContext(); // context for the events for providing state and dispatch to components
// reducer updates the state based on action by replacing old state with new state
export const eventsReducer=(state,action)=>{
    switch(action.type){ // action is what we dispatch from components, it has a type and a payload
        case "SET_EVENTS":
            return{
                events: action.payload // we are setting the events to the payload data from action
            }
        case "CREATE_EVENT":
            return{
                events: [action.payload,...state.events].sort((a,b)=>new Date(a.start)-new Date(b.start)) 
                // we are adding the new event to the existing events and sorting by start date
            }
        case "DELETE_EVENT":
            return{
                events: state.events.filter((e)=> e._id !== action.payload._id)
                // filtering out the deleted events
            }
        case "UPDATE_EVENT":
            return{
                events: state.events.map((e) => e._id === action.payload._id ? action.payload : e)
                // updating the event with the new data
            }
        default:
            return state; // if action type is not matched, we return the current state without any changes
    }
}

export const EventsContextprovider=({children})=>{ // children is what is wrapped by this provider
    // state is current events state, dispatch fn is to send actions to reducer for state updates
    const [state,dispatch]=useReducer(eventsReducer,{ 
        events:null
    });

    return(
        <EventsContext.Provider value={{...state,dispatch}}>
            {children}
        </EventsContext.Provider>
    )
}