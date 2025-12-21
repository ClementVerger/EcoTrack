import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
	const { isAuthenticated, logout } = useAuth()
	const navigate = useNavigate()

	const onLogout = () => {
		logout()
		navigate('/login')
	}

	return (
		<header style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
			<nav>
				<Link to="/" style={{ marginRight: '1rem' }}>
					EcoTrack
				</Link>
				{!isAuthenticated && (
					<>
						<Link to="/login" style={{ marginRight: '0.5rem' }}>
							Connexion
						</Link>
						<Link to="/register">Inscription</Link>
					</>
				)}
				{isAuthenticated && (
					<button onClick={onLogout} style={{ marginLeft: '1rem' }}>
						Déconnexion
					</button>
				)}
			</nav>
		</header>
	)
}
