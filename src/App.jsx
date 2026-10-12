import { useStore, entryScreen } from './state/store.jsx';
import A11yLayer from './components/A11yLayer.jsx';
import Vision from './screens/Vision.jsx';
import Welcome from './screens/Welcome.jsx';
import Signup from './screens/Signup.jsx';
import Login from './screens/Login.jsx';
import WhoReads from './screens/WhoReads.jsx';
import ParentGate from './screens/ParentGate.jsx';
import ChooseBook from './screens/ChooseBook.jsx';
import GetReady from './screens/GetReady.jsx';
import Reader from './screens/Reader.jsx';
import Film from './screens/Film.jsx';
import Explore from './screens/Explore.jsx';
import Finished from './screens/Finished.jsx';
import ParentSpace from './screens/ParentSpace.jsx';
import AddChild from './screens/AddChild.jsx';
import ProfileTest from './screens/ProfileTest.jsx';
import ImportBook from './screens/ImportBook.jsx';

const SCREENS = {
  vision: Vision,
  welcome: Welcome,
  signup: Signup,
  login: Login,
  who: WhoReads,
  parent_gate: ParentGate,
  choose: ChooseBook,
  ready: GetReady,
  reader: Reader,
  film: Film,
  explore: Explore,
  finished: Finished,
  parent: ParentSpace,
  add_child: AddChild,
  profile_test: ProfileTest,
  import_book: ImportBook,
};

// Écrans accessibles sans être connecté
const PUBLIC = new Set(['vision', 'welcome', 'signup', 'login']);

export default function App() {
  const { state } = useStore();
  let name = state.screen?.name || entryScreen(state);
  // Garde : sans compte connecté, on revient à l'accueil / la connexion
  if (!PUBLIC.has(name) && !(state.account && state.loggedIn)) name = entryScreen(state);
  const Screen = SCREENS[name] || WhoReads;
  const params = state.screen?.name === name ? state.screen?.params || {} : {};
  return (
    <A11yLayer>
      {/* key : chaque écran repart d'un état propre quand on navigue */}
      <Screen key={`${name}-${JSON.stringify(params)}`} params={params} />
    </A11yLayer>
  );
}
