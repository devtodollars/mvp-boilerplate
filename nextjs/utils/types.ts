import { Tables } from '@/types_db';

export enum AuthState {
  Signin = 'signin',
  ForgotPassword = 'forgot_password',
  Signup = 'signup',
  UpdatePassword = 'update_password'
}

export type StateInfo = {
  title: string;
  description?: string;
  submitText: string;
  onSubmit: () => void;
  hasEmailField: boolean;
  hasPasswordField: boolean;
  hasOAuth: boolean;
};

type Subscription = Tables<'subscriptions'>;
type Price = Tables<'prices'>;
type Product = Tables<'products'>;

export type SubscriptionWithPriceAndProduct = Subscription & {
  prices:
    | (Price & {
        products: Product | null;
      })
    | null;
};
