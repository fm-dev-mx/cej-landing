import { type Strength, type ConcreteType } from './quote';

export type CalculatorMode = 'knownM3' | 'assistM3' | null;
export type AssistVolumeMode = 'dimensions' | 'area';
export type CofferedSize = '7' | '10' | '15';

export type WorkTypeId =
    | 'slab'
    | 'lightInteriorFloor'
    | 'vehicleFloor'
    | 'footings'
    | 'walls';

export type WorkTypeConfig = {
    id: WorkTypeId;
    label: string;
    description: string;
    recommendedStrength: Strength;
    icon?: string;
};

export type CalculatorState = {
    mode: CalculatorMode;
    volumeMode: AssistVolumeMode;
    strength: Strength | null;
    type: ConcreteType | null;
    m3: string;
    workType: WorkTypeId | null;
    length: string;
    width: string;
    thicknessByDims: string;
    area: string;
    thicknessByArea: string;
    hasCoffered: 'yes' | 'no';
    cofferedSize: CofferedSize | null;

    // Phase 2: Expert Fields
    additives: string[];
    showExpertOptions: boolean;
};

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
    mode: null,
    volumeMode: 'dimensions',
    strength: null,
    type: null,
    m3: '',
    workType: null,
    length: '',
    width: '',
    thicknessByDims: '10',
    area: '',
    thicknessByArea: '10',
    hasCoffered: 'no',
    cofferedSize: '7',
    additives: [],
    showExpertOptions: false,
};
