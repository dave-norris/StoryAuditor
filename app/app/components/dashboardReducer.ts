import { DashboardItem } from '@/lib/queries/dashboard/getItems';

export interface DashboardState {
  items: DashboardItem[];
  hasMore: boolean;
  nextCursor: string | null;
  isLoading: boolean;
  error: string | null;
}

export type DashboardAction =
  | { type: 'LOAD_SUCCESS'; payload: { items: DashboardItem[]; nextCursor: string | null; hasMore: boolean } }
  | { type: 'APPEND_SUCCESS'; payload: { items: DashboardItem[]; nextCursor: string | null; hasMore: boolean } }
  | { type: 'REMOVE_ITEM'; payload: { id: string; source: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export const initialState: DashboardState = {
  items: [],
  hasMore: false,
  nextCursor: null,
  isLoading: true,
  error: null,
};

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...state,
        items: action.payload.items,
        nextCursor: action.payload.nextCursor,
        hasMore: action.payload.hasMore,
        isLoading: false,
        error: null,
      };

    case 'APPEND_SUCCESS':
      return {
        ...state,
        items: [...state.items, ...action.payload.items],
        nextCursor: action.payload.nextCursor,
        hasMore: action.payload.hasMore,
        isLoading: false,
        error: null,
      };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.id === action.payload.id && item.source === action.payload.source)
        ),
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    default:
      return state;
  }
}
