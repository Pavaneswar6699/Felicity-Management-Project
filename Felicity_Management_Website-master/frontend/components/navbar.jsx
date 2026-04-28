import { Link } from 'react-router-dom'
import { useLogout } from '../hooks/useLogout';
import { useAuthContext } from '../hooks/useAuthContext';

const Navbar = () => {
    const { logout } = useLogout();
    const { participant, organizer, admin } = useAuthContext();

    const handleClick = () => {
        logout();
    }
    return (
        <header>
            <div className="container">
                <Link to="/">Felicity Website</Link>
                <nav>
                    {(participant || organizer || admin) &&
                        <div className='logout-button'>
                            {participant &&
                                <>
                                    <span>{participant.firstName}</span>
                                    <Link to="/participantHome"><button>Dashboard</button></Link>&nbsp;
                                    <Link to="/participantOrganizers"><button>Organizers</button></Link>&nbsp;
                                    <Link to="/myEvents"><button>My Events</button></Link>&nbsp;
                                    <Link to="/participantProfile"><button>Profile</button></Link>&nbsp;
                                </>
                            }
                            {organizer &&
                                <>
                                    <span>{organizer.organizerName}</span>
                                    <Link to="/"><button>Dashboard</button></Link>&nbsp;
                                    <Link to="/profile"><button>Profile</button></Link>&nbsp;
                                </>}
                            {admin &&
                                <>
                                    <span>Admin</span>
                                    <Link to="/adminHome"><button>Dashboard</button></Link>&nbsp;
                                    <Link to="/adminPasswordRequests"><button>Password Requests</button></Link>&nbsp;
                                </>
                            }
                            <button onClick={handleClick}>Logout</button>
                        </div>
                    }
                    {!participant && !organizer && !admin &&
                        <div className='register-login'>
                            <Link to="/register"><button>Register</button></Link>
                            <Link to="/login"><button>Login</button></Link>
                        </div>
                    }
                </nav>
            </div>
        </header>
    )
}

export default Navbar;