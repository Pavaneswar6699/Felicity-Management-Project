export const OLoginForm = ({ email, setEmail, password, setPassword, handleSubmit, organizerLoading, organizerError }) => {
    return (
        <form className="Login-form" onSubmit={handleSubmit}>
            <h2>Organizer Login</h2>
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
            <button disabled={organizerLoading}>Login</button>
            {organizerError && <div className="error">{organizerError}</div>}
        </form>
    )
}