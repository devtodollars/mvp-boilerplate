import { Tables } from '@/types_db';

export enum AuthState {
  Signin = 'signin',
  ForgotPassword = 'forgot_password',
  Signup = 'signup',
  UpdatePassword = 'update_password',
  VerifyEmail = 'verify_email'
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
type XmrPrice = Tables<'xmr_prices'>;
type XmrProduct = Tables<'xmr_products'>;

export type SubscriptionWithPriceAndProduct = Subscription & {
  prices:
    | (Price & {
        products: Product | null;
      })
    | null;
  xmr_prices:
    | (XmrPrice & {
        xmr_products: XmrProduct | null;
      })
    | null;
};
