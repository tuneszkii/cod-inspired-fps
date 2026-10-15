import { MemoryRouter } from 'react-router-dom';
import { WarzoneWeb } from './warzone-web.js';

/** Main menu / loadout screen; press DEPLOY to start a match. */
export const WarzoneWebBasic = () => {
  return (
    <MemoryRouter>
      <div style={{ position: 'relative', height: 640 }}>
        <WarzoneWeb />
      </div>
    </MemoryRouter>
  );
};
