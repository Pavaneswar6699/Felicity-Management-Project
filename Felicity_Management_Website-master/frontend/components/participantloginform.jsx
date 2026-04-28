export const PLoginForm = ({ email, setEmail, password, setPassword, participantType, setParticipantType, handleParticipantSubmit, isLoading, error }) => {
    return (
        <form className="Login-form" onSubmit={handleParticipantSubmit}>
            <h2>Participant Login</h2>
            <label>Email:</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <label>Password:</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <label>Participant Type:</label>
            <select
                value={participantType}
                onChange={(e) => setParticipantType(e.target.value)}
            >
                <option value="IIIT">IIIT</option>
                <option value="Non-IIIT">Non-IIIT</option>
            </select>
            <button disabled={isLoading}>Login</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}