import { getApiUrl } from '../utils/apiConfig';
import { fetchWithAuth } from '../utils/apiUtils';

export interface Receipt {
  _id: string;
  booking: {
    _id: string;
    service: {
      _id: string;
      name: string;
      price: number;
      iconName: string;
    };
    user: {
      _id: string;
      name: string;
      email: string;
    };
    status: string;
  };
  finalPrice: number;
  servicePersonnelName: string;
  completionDate: string;
  createdAt: string;
  updatedAt: string;
}

class ReceiptService {
  private readonly API_BASE_PATH = '/api/receipts';

  /**
   * Get all receipts
   */
  async getAllReceipts(): Promise<Receipt[]> {
    try {
      const response = await fetchWithAuth(getApiUrl(this.API_BASE_PATH));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching receipts: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching all receipts:', error);
      throw error;
    }
  }

  /**
   * Get receipt by ID
   */
  async getReceiptById(id: string): Promise<Receipt> {
    try {
      const response = await fetchWithAuth(getApiUrl(`${this.API_BASE_PATH}/${id}`));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching receipt: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching receipt with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get receipt by booking ID
   */
  async getReceiptByBookingId(bookingId: string): Promise<Receipt> {
    try {
      const response = await fetchWithAuth(getApiUrl(`${this.API_BASE_PATH}/booking/${bookingId}`));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error fetching receipt: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Error fetching receipt for booking ID ${bookingId}:`, error);
      throw error;
    }
  }
}

const receiptService = new ReceiptService();
export default receiptService;