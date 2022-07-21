import React from "react"

const App = () => {
	const block = 'b-app'

	return (
		<div className={block}>
			<div className={`${block}__picture`}>
				<img className={`${block}`} src="https://s3.amazonaws.com/media-p.slid.es/uploads/alexanderfarennikov/images/1198519/reactjs.png" alt="" />
			</div>
		</div>
	)
}

export default App