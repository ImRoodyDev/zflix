// External imports
import React from 'react';

// Components
import Page from '../components/main/Page';
import AppFooter from '../components/nav/AppFooter';
import AppDownload from '../components/sections/Download';
import AppHome from '../components/sections/HomeSection';
import AppPlans from '../components/sections/Plans';

const Home = () => {
	console.log({
		scale: window.visualViewport?.scale,
		innerWidth: window.innerWidth,
		visualWidth: window.visualViewport?.width,
		docWidth: document.documentElement.scrollWidth,
		bodyWidth: document.body.scrollWidth,
	});

	return (
		<Page
			enableHeader
			statusBarStyle={'light'}
			backgroundColor={'black'}
			className="scroll-area"
			contentContainerClassName={'app-content'}
			stickyHeaderIndices={[0]}
			bounces={false}
			showsVerticalScrollIndicator={true}
		>
			<AppHome />
			<AppDownload />
			<AppPlans />
			<AppFooter />
		</Page>
	);
};

export default Home;
