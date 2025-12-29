import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'

export default function Home() {
	const { isAuthenticated, user } = useAuth()
	const { notify } = useNotification()

	// Démonstration des notifications (à retirer en production)
	const demoNotifications = () => {
		notify.points(10, 'Signalement validé')
		
		setTimeout(() => {
			notify.badge('Éco-Citoyen', 'Premier signalement validé !')
		}, 1000)
		
		setTimeout(() => {
			notify.levelUp(2, 'Apprenti Écolo')
		}, 2500)
	}

	return (
		<section style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
			<h2 style={{ color: '#2e7d32', marginBottom: '1rem' }}>🌱 Bienvenue sur EcoTrack</h2>
			
			{isAuthenticated && user ? (
				<div style={{ 
					backgroundColor: '#e8f5e9', 
					padding: '1.5rem', 
					borderRadius: '12px',
					marginBottom: '2rem'
				}}>
					<h3 style={{ margin: '0 0 1rem 0' }}>
						Bonjour {user.firstname} ! 👋
					</h3>
					<div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
						<div>
							<span style={{ color: '#666', fontSize: '0.9rem' }}>Vos points</span>
							<p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f57f17', margin: '0.25rem 0' }}>
								⭐ {user.points ?? 0}
							</p>
						</div>
						<div>
							<span style={{ color: '#666', fontSize: '0.9rem' }}>Niveau</span>
							<p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2e7d32', margin: '0.25rem 0' }}>
								🎯 Niveau {user.level ?? 1}
							</p>
						</div>
					</div>
				</div>
			) : (
				<p style={{ color: '#666' }}>
					Connectez-vous pour commencer à signaler et gagner des récompenses !
				</p>
			)}

			<p style={{ lineHeight: '1.6', color: '#555' }}>
				EcoTrack vous permet de signaler les conteneurs pleins dans votre ville 
				et de gagner des points et badges pour vos contributions écologiques.
			</p>

			{/* Bouton de démonstration - à retirer en production */}
			{isAuthenticated && (
				<button
					onClick={demoNotifications}
					style={{
						marginTop: '2rem',
						padding: '0.75rem 1.5rem',
						backgroundColor: '#9c27b0',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						fontSize: '1rem',
					}}
				>
					🎁 Tester les notifications de récompenses
				</button>
			)}
		</section>
	)
}
