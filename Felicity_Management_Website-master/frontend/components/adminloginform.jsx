export const ALoginForm = ({ email, setEmail, password, setPassword, handleSubmit, isLoading, error }) => {
    return (
        <form className="Login-form" onSubmit={handleSubmit}>
            <h2>Admin Login</h2>
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
            <button disabled={isLoading}>Login</button>
            {error && <div className="error">{error}</div>}
        </form>
    )
}