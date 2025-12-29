import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import '../styles/Register.css'

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email)
}

export default function Register() {
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const validate = () => {
    if (!firstname || firstname.trim().length < 2) return 'Prénom trop court'
    if (!lastname || lastname.trim().length < 2) return 'Nom trop court'
    if (!isValidEmail(email)) return "Email invalide"
    if (!password || password.length < 8) return 'Mot de passe trop court (min 8)'
    if (password !== passwordConfirm) return 'Les mots de passe ne correspondent pas'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const v = validate()
    if (v) return setError(v)
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      const token = res?.data?.token
      const userData = res?.data?.user
      if (token) {
        login(token, userData) // Connexion automatique après inscription
        navigate('/')
      } else {
        navigate('/login')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-page">
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <h2>Inscription</h2>
        {error && <div className="register-error">{error}</div>}
        <label>
          Prénom
          <input value={firstname} onChange={(e) => setFirstname(e.target.value)} required />
        </label>
        <label>
          Nom
          <input value={lastname} onChange={(e) => setLastname(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mot de passe
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          Confirmer le mot de passe
          <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : "S'inscrire"}
        </button>
      </form>
    </div>
  )
}