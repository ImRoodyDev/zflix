// External imports
import React from 'react';
import { InteractionManager } from 'react-native';

// Components
import Page from '../components/main/Page';
import AppFooter from '../components/nav/AppFooter';
import AppDownload from '../components/sections/Download';
import AppHome from '../components/sections/HomeSection';
import AppPlans from '../components/sections/Plans';

const Home = () => {
	// Only the hero (AppHome) is above the fold. Mounting the other sections eagerly makes the
	// whole page mount in one blocking commit on navigation (see PROFILING.md → commit #3). Defer
	// them until after the first frame so the hero paints instantly, then the rest mounts a beat
	// later. The hero button keeps TV focus, so the deferred sections land before the user scrolls.
	const [showBelowFold, setShowBelowFold] = React.useState(false);

	React.useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => setShowBelowFold(true));
		return () => task.cancel();
	}, []);

	return (
		<Page
			enableHeader
			statusBarStyle={'light'}
			backgroundColor={'black'}
			className="scroll-area"
			contentContainerClassName={'app-content'}
			stickyHeaderIndices={[0]}
			bounces={false}
			showsVerticalScrollIndicator={false}
			removeClippedSubviews={false}
		>
			<AppHome />
			{showBelowFold && (
				<>
					<AppDownload />
					<AppPlans />
					<AppFooter />
				</>
			)}
		</Page>
	);
};

export default Home;
