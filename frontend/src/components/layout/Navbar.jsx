import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
	return (
		<header style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
			<nav>
				<Link to="/" style={{ marginRight: '1rem' }}>
					EcoTrack
				</Link>
			</nav>
		</header>
	)
}
