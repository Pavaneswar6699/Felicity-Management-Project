import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext } from '../hooks/useAuthContext'
// pages and components
import OrganizerHome from '../pages/organizerHome'
import OrganizerEventDetails from '../pages/OrganizerEventDetails'
import OrgProfile from '../pages/orgProfilePage'
import ParticipantProfile from '../pages/participantProfilePage'
import Navbar from '../components/navbar'
import Login from '../pages/login'
import Register from '../pages/participantRegister'
import AdminLogin from '../pages/adminLogin'
import ParticipantHome from '../pages/participantHome'
import ParticipantEventDetails from '../pages/ParticipantEventDetails'
import ParticipantOnboarding from '../pages/participantOnboarding'
import ParticipantOrganizers from '../pages/participantOrganizers'
import ParticipantMyEvents from '../pages/participantMyEvents'
import OrganizerDetails from '../pages/OrganizerDetails'
import AdminHome from '../pages/adminHome'
import AdminPasswordRequests from '../components/adminPasswordRequests'
import AdminOrganizerHistory from '../pages/AdminOrganizerHistory'

function App() {
  const { organizer, participant, admin } = useAuthContext();
  const onboardingPending = localStorage.getItem('participantOnboardingPending') === 'true';

  return (
    <>
      <div className="App">
        <BrowserRouter>
          <Navbar />
          <div className="pages">
            <Routes>
              <Route
                path="/"
                element={organizer ? <OrganizerHome /> : <Navigate to="/login" />}
              />
              <Route
                path="/organizer/event/:eventId"
                element={organizer ? <OrganizerEventDetails /> : <Navigate to="/login" />}
              />
              <Route
                path="/profile"
                element={organizer ? <OrgProfile /> : <Navigate to="/login" />}
              />
              <Route
                path="/login"
                element={organizer ? <Navigate to="/" /> : participant ? <Navigate to="/participantHome" /> : admin ? <Navigate to="/adminHome" /> : <Login />}
              />
              <Route
                path="/register"
                element={participant ? <Navigate to={onboardingPending ? "/participantOnboarding" : "/participantHome"} /> : <Register />}
              />
              <Route
                path="/adminLogin"
                element={admin ? <Navigate to="/adminHome" /> : <AdminLogin />}
              />
              <Route
                path="/participantHome"
                element={participant ? <ParticipantHome /> : <Navigate to="/login" />}
              />
              <Route
                path="/participant/event/:eventId"
                element={participant ? <ParticipantEventDetails /> : <Navigate to="/login" />}
              />
              <Route
                path="/participantOnboarding"
                element={participant ? <ParticipantOnboarding /> : <Navigate to="/login" />}
              />
              <Route
                path="/participantProfile"
                element={participant ? <ParticipantProfile /> : <Navigate to="/login" />}
              />
              <Route
                path="/participantOrganizers"
                element={participant ? <ParticipantOrganizers /> : <Navigate to="/login" />}
              />
              <Route
                path="/participant/organizer/:organizerId"
                element={participant ? <OrganizerDetails /> : <Navigate to="/login" />}
              />
              <Route
                path="/myEvents"
                element={participant ? <ParticipantMyEvents /> : <Navigate to="/login" />}
              />
              <Route
                path="/adminHome"
                element={admin ? <AdminHome /> : <Navigate to="/login" />}
              />
              <Route
                path="/adminPasswordRequests"
                element={admin ? <AdminPasswordRequests /> : <Navigate to="/login" />}
              />
              <Route
                path="/admin/organizers/:organizerId/history"
                element={admin ? <AdminOrganizerHistory /> : <Navigate to="/login" />}
              />
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </>
  )
}

export default App
