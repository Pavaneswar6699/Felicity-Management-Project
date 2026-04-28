export const PRegisterForm=({firstName, setFirstName, lastName, setLastName, email, setEmail, password, setPassword, participantType, setParticipantType, collegeName, setCollegeName, isLoading, error, handleSubmit})=>{
    return(
        <form className="Registration-form" onSubmit={handleSubmit}>
            <h2>Participant Registration</h2>
            <label>First Name: <span style={{color:'red'}}>*</span></label>
            <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />
            <label>Last Name:</label>
            <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />
            <label>Email: <span style={{color:'red'}}>*</span></label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <label>Password: <span style={{color:'red'}}>*</span></label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <label>Participant Type: <span style={{color:'red'}}>*</span></label>
            <select
                value={participantType}
                onChange={(e) => setParticipantType(e.target.value)}
            >
                <option value="IIIT">IIIT</option>
                <option value="Non-IIIT">Non-IIIT</option>
            </select>
            {participantType === 'Non-IIIT' && (
                <>
                    <label>College Name: <span style={{color:'red'}}>*</span></label>
                    <input
                        type="text"
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                    />
                </>
            )}
            <button disabled={isLoading}>Register</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}