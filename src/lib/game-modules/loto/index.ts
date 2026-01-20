import { LotoGameModule } from './logic/LotoEngine';
import type { GameState } from '../../types';

export const LotoModule = {
    id: 'loto',
    name: 'Loto 90',
    Engine: LotoGameModule,
    // Add components, assets, etc. here later
};
