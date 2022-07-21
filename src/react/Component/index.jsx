import ReactDOM from 'react-dom'
import React from 'react'

import App from './App/index.jsx'

document.addEventListener("DOMContentLoaded", () => {
	const app = document.getElementById("App")
 	
	app ? ReactDOM.render(<App />, app) : null
});
