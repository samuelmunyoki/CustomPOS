import axios, { AxiosError } from 'axios';

export interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
  callbackUrl?: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage?: string;
}

export interface MPesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  callbackUrl?: string;
}

export interface AccessTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface TransactionStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export class MPesaError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'MPesaError';
    Object.setPrototypeOf(this, MPesaError.prototype);
  }
}

const TOKEN_REFRESH_BUFFER_MS = 60_000;

class MPesaService {
  private readonly config: MPesaConfig;
  private readonly baseUrl: string;

  private accessToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: MPesaConfig) {
    this.config = config;
    this.baseUrl =
      config.environment === 'production'
        ? '/api/safaricom-prod'
        : '/api/safaricom';
  }

  private static toBase64(str: string): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(str, 'utf-8').toString('base64');
    }
    if (typeof btoa === 'function') {
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      ));
    }
    throw new MPesaError('No base64 encoding method available', 'ENCODING_ERROR');
  }

  private static generateTimestamp(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  private generatePassword(timestamp: string): string {
    return MPesaService.toBase64(
      `${this.config.shortcode}${this.config.passkey}${timestamp}`
    );
  }

  private static formatPhoneNumber(raw: string): string {
    const digits = raw.replace(/\D/g, '');

    let normalised: string;

    if (digits.length === 10 && digits.startsWith('0')) {
      normalised = '254' + digits.slice(1);
    } else if (digits.length === 9 && digits.startsWith('7')) {
      normalised = '254' + digits;
    } else if (digits.length === 12 && digits.startsWith('254')) {
      normalised = digits;
    } else {
      throw new MPesaError(
        `Invalid phone number: "${raw}"`,
        'PHONE_FORMAT_ERROR'
      );
    }

    if (normalised[3] !== '7') {
      throw new MPesaError(
        `Phone number does not appear to be a Kenyan mobile number: "${raw}"`,
        'PHONE_FORMAT_ERROR'
      );
    }

    return normalised;
  }

  private static validateSTKPushRequest(req: STKPushRequest): void {
    if (!req.phoneNumber || req.phoneNumber.trim() === '') {
      throw new MPesaError('Phone number is required', 'VALIDATION_ERROR');
    }

    if (typeof req.amount !== 'number' || !Number.isFinite(req.amount)) {
      throw new MPesaError('Amount must be a valid number', 'VALIDATION_ERROR');
    }

    if (req.amount < 1) {
      throw new MPesaError(
        'Amount must be at least 1 KES',
        'VALIDATION_ERROR'
      );
    }

    if (req.amount > 150_000) {
      throw new MPesaError(
        'Amount exceeds M-Pesa STK Push limit (150,000 KES)',
        'VALIDATION_ERROR'
      );
    }
  }

  async generateAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
      return this.accessToken;
    }

    try {
      const credentials = MPesaService.toBase64(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      );

      const response = await axios.get<AccessTokenResponse>(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Cache-Control': 'no-cache',
          },
        }
      );

      const token = response.data.access_token;
      if (!token) {
        throw new MPesaError('No access token in response', 'TOKEN_ERROR');
      }

      this.accessToken = token;
      this.tokenExpiry = Date.now() + (parseInt(response.data.expires_in, 10) || 3600) * 1000;

      return this.accessToken;
    } catch (error: unknown) {
      if (error instanceof MPesaError) throw error;

      const detail =
        error instanceof AxiosError
          ? error.response?.data ?? error.message
          : (error as Error).message;

      console.error('Access-token error:', detail);

      throw new MPesaError(
        'Failed to generate M-Pesa access token',
        'TOKEN_ERROR',
        error
      );
    }
  }

  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    MPesaService.validateSTKPushRequest(request);

    const formattedPhone = MPesaService.formatPhoneNumber(request.phoneNumber);
    const token = await this.generateAccessToken();
    const timestamp = MPesaService.generateTimestamp();
    const password = this.generatePassword(timestamp);

    // const callbackUrl =
    //   request.callbackUrl ||
    //   this.config.callbackUrl ||
    //   (typeof window !== 'undefined'
    //     ? `${window.location.origin}/api/mpesa/callback`
    //     : undefined);
    const callbackUrl = "https://webhook.site/5351a5f4-ac41-44fd-961e-39a3607f24f1";

    if (!callbackUrl) {
      throw new MPesaError(
        'No callback URL available. Provide one in the request, config, or run in a browser.',
        'VALIDATION_ERROR'
      );
    }

    const payload = {
      BusinessShortCode: this.config.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.floor(request.amount),
      PartyA: formattedPhone,
      PartyB: this.config.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: (request.accountReference ?? 'POS Payment').slice(0, 20),
      TransactionDesc: (request.transactionDesc ?? 'Payment').slice(0, 13),
    };

    try {
      const response = await axios.post<STKPushResponse>(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30_000,
        }
      );

      if (response.data.ResponseCode !== '0') {
        throw new MPesaError(
          response.data.ResponseDescription || 'STK Push failed',
          response.data.ResponseCode
        );
      }

      return response.data;
    } catch (error: unknown) {
      if (error instanceof MPesaError) throw error;

      const detail =
        error instanceof AxiosError
          ? error.response?.data?.errorMessage ?? error.message
          : (error as Error).message;

      console.error('STK Push error:', detail);

      throw new MPesaError(
        typeof detail === 'string' ? detail : 'Failed to initiate STK Push',
        'STK_PUSH_ERROR',
        error
      );
    }
  }

  async checkTransactionStatus(
    checkoutRequestId: string
  ): Promise<TransactionStatusResponse> {
    if (!checkoutRequestId || checkoutRequestId.trim() === '') {
      throw new MPesaError('CheckoutRequestID is required', 'VALIDATION_ERROR');
    }

    const token = await this.generateAccessToken();
    const timestamp = MPesaService.generateTimestamp();
    const password = this.generatePassword(timestamp);

    try {
      const response = await axios.post<TransactionStatusResponse>(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.config.shortcode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30_000,
        }
      );

      return response.data;
    } catch (error: unknown) {
      const detail =
        error instanceof AxiosError
          ? error.response?.data ?? error.message
          : (error as Error).message;

      console.error('Status-check error:', detail);

      throw new MPesaError(
        'Failed to check transaction status',
        'STATUS_CHECK_ERROR',
        error
      );
    }
  }

  clearTokenCache(): void {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }
}

export default MPesaService;