import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userModel from '../models/userModel.js';
import orderModel from '../models/orderModel.js';
import {
  forgotPasswordController,
  loginController,
  getAllOrdersController,
  orderStatusController,
  registerController,
  updateProfileController
} from './authController.js';
import { hashPassword, comparePassword } from '../helpers/authHelper.js';
import jwt from 'jsonwebtoken';

const mockRes = () => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
};

const mockReq = (body) => ({ body });

describe('forgotPasswordController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return status 400 with correct error message when email is missing', async () => {
    const req = mockReq({});
    const res = mockRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'Email is required' });
  });

  it('should return status 400 with correct error message when answer is missing', async () => {
    const req = mockReq({ email: 'test@email.com' });
    const res = mockRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'answer is required' });
  });

  it('should return status 400 with correct error message when newPassword is missing', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer' });
    const res = mockRes();

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({ message: 'New Password is required' });
  });

  it('should return 404 with correct error message when user not found', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@email.com', answer: 'answer' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Wrong Email Or Answer',
    });
  });

  it('should return 200 and update password when user exists', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({ _id: 'uid-123' });
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce({});

    await forgotPasswordController(req, res);

    expect(userModel.findOne).toHaveBeenCalledWith({ email: 'test@email.com', answer: 'answer' });

    const updateArgs = userModel.findByIdAndUpdate.mock.calls[0][1];
    const hashedPassword = updateArgs.password;

    const match = await comparePassword('newPassword', hashedPassword);
    expect(match).toBe(true);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: 'Password Reset Successfully',
    });
  });

  it('should return status 500 with correct error message when findOne throws error', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();
    jest.spyOn(userModel, 'findOne').mockRejectedValueOnce(new Error('Some Error'));

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Something went wrong',
        })
    );
  });

  it('should return status 500 with correct error message when findByIdAndUpdate throws error', async () => {
    const req = mockReq({ email: 'test@email.com', answer: 'answer', newPassword: 'newPassword' });
    const res = mockRes();
    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce({ _id: 'uid-123' });
    jest.spyOn(userModel, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('Some Error'));

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Something went wrong',
        })
    );
  });
});

/* Login Controller Tests */
describe('loginController unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // test case: email field is empty
  it('should return 404 if email empty', async () => {
    const req = mockReq({ email: '', password: 'password123' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Invalid email or password',
      success: false,
     });
  });

  // test case: password field is empty
  it('should return 404 if password empty', async () => {
    const req = mockReq({ email: 'user@example.com', password: '' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Invalid email or password',
      success: false,
     });
  });

  // test case: email not registered
  it('should return 404 if email not registered', async () => {
    jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
    const req = mockReq({ email: 'user@example.com', password: 'password123' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Email is not registerd',
      success: false
     });
  });

  // test case: correct email but wrong password
  it('should return 200 if password does not match', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'user@example.com', password: hashedPassword });
    const req = mockReq({ email: 'user@example.com', password: 'wrongPassword' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Invalid Password',
      success: false
    });
  });

  // test case: invalid token
  it('should return 500 if token is invalid', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ email: 'user@example.com', password: hashedPassword });
    jest.spyOn(jwt, 'sign').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const req = mockReq({ email: 'user@example.com', password: 'correctPassword' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      message: 'Error in login',
      success: false,
      error: new Error('Invalid token'),
    });
  });

  // test case: successful login
  it('should return 200 and token on successful login', async () => {
    const hashedPassword = await hashPassword('correctPassword');
    jest.spyOn(userModel, 'findOne').mockResolvedValue({ 
      _id: '1', 
      name: 'Test User',
      email: 'user@example.com', 
      password: hashedPassword,
      phone: '12345678',
      address: '123 Test St',
      role: 0,
    });
    jest.spyOn(jwt, 'sign').mockReturnValue('mocktoken');
    const req = mockReq({ email: 'user@example.com', password: 'correctPassword' });
    const res = mockRes();

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'login successfully',
        token: 'mocktoken',
        user: expect.objectContaining({
          _id: '1', 
          name: 'Test User',
          email: 'user@example.com',
          phone: '12345678',
          address: '123 Test St',
          role: 0
        })
      })
    );
  });

});

describe('getAllOrdersController', () => {
  // Equivalence Partitioning - either success or fail
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return orders with correct populate and sort when orders exists', async () => {
    const orders = [
      { _id: 'o2', createdAt: '2024-01-01' },
      { _id: 'o1', createdAt: '2024-02-01' },
    ];
    const chain = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(orders),
    };
    jest.spyOn(orderModel, 'find').mockReturnValue(chain);

    const req = mockReq();
    const res = mockRes();

    await getAllOrdersController(req, res);

    expect(orderModel.find).toHaveBeenCalledWith({});
    expect(chain.populate).toHaveBeenNthCalledWith(1, 'products', '-photo');
    expect(chain.populate).toHaveBeenNthCalledWith(2, 'buyer', 'name');
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(res.json).toHaveBeenCalledWith(orders);
  });

  it('should respond 500 with correct message when db throws error', async () => {
    jest.spyOn(orderModel, 'find').mockImplementation(() => { throw new Error('Some Error'); });

    const req = mockReq();
    const res = mockRes();

    await getAllOrdersController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Error WHile Geting Orders',
        error: new Error('Some Error')
      })
    );
  });
});

describe('orderStatusController', () => {
  // Equivalence partitioning - order found, order not found, db error
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should return updated order when order is found', async () => {
    const updatedOrder = { id: '123', status: 'Shipped' };
    jest.spyOn(orderModel, 'findByIdAndUpdate').mockResolvedValue(updatedOrder);

    const req = {
      body: { status: 'Shipped' },
      params: { orderId: '123' },
    };
    const res = mockRes();

    await orderStatusController(req, res);

    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { status: 'Shipped' },
        { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(updatedOrder);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return null when order not found', async () => {
    jest.spyOn(orderModel, 'findByIdAndUpdate').mockResolvedValue(null);

    const req = {
      body: { status: 'Shipped' },
      params: { orderId: '123' },
    };
    const res = mockRes();

    await orderStatusController(req, res);

    expect(res.json).toHaveBeenCalledWith(null);
  });

  it('should return 500 when db throws an error', async () => {
    jest.spyOn(orderModel, 'findByIdAndUpdate').mockRejectedValue(new Error('Some Error'));

    const req = {
      body: { status: 'Shipped' },
      params: { orderId: '123' },
    };
    const res = mockRes();

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error While Updateing Order',
          error: new Error('Some Error'),
        })
    );
  });
});

/* Register Controller Tests */
describe('registerController unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  test.each([
    [ 'name',
      { 
        email: 'user@example.com', 
        password: 'password123', 
        phone: '12345678',
        address: '123 Test St',
        answer:'Test Answer'
      }, { message: "Name is required" }],
    [ 'email',
      {
        name: 'Test User', 
        password: 'password123', 
        phone: '12345678',
        address: '123 Test St',
        answer:'Test Answer'
      }, { message: "Email is required" }],
    [ 'password',
      {
        name: 'Test User', 
        email: 'user@example.com', 
        phone: '12345678',
        address: '123 Test St',
        answer:'Test Answer'
      }, { message: "Password is required" }],
    [ 'phone number',
      {
        name: 'Test User', 
        email: 'user@example.com', 
        password: 'password123',
        address: '123 Test St',
        answer:'Test Answer'
      }, { message: "Phone number is required" }],
    [ 'address',
      {
        name: 'Test User', 
        email: 'user@example.com', 
        password: 'password123', 
        phone: '12345678',
        answer:'Test Answer'
      }, { message: "Address is required" }],
    [ 'answer',
      {
        name: 'Test User', 
        email: 'user@example.com', 
        password: 'password123', 
        phone: '12345678',
        address: '123 Test St'
      }, { message: "Answer is required" }],
  ])('should return 400 if %s is missing', async (field, body, expectedError) => {
    const req = mockReq(body);
    const res = mockRes();

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(expectedError);
  });

  it('should return 409 if user already exists', async () => {
    const mockDB = new Map([['user@example.com', { email: 'user@example.com' }]]);

    jest.spyOn(userModel, 'findOne').mockImplementation(async ( query ) => {
      const email = query?.email;
      return mockDB.get(email) || null;
    });

    const req = mockReq({
      name: 'Test User',
      email: 'User@example.com',
      password: 'password123',
      phone: '12345678',
      address: '123 Test St',
      answer: 'Test Answer'
    });
    const res = mockRes();

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already registered, please login"
    });
  });

  it('should return 200 and user data on successful registration', async () => {
    const req = mockReq({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      phone: '12345678',
      address: '123 Test St',
      answer: 'Test Answer'
    });
    const res = mockRes();
    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(userModel.prototype, 'save').mockResolvedValueOnce({
      _id: '1',
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      phone: '12345678',
      address: '123 Test St',
      answer: 'Test Answer',
      role: 0
    });

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User Registered Successfully",
      user: expect.objectContaining({
        _id: expect.any(String),
        name: 'Test User',
        email: 'user@example.com',
        phone: '12345678',
        address: '123 Test St',
        password: 'password123',
        answer: 'Test Answer',
        role: 0
      })
    });
  });

  it('should return 500 if error occurs during registration', async () => {
    const req = mockReq({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      phone: '12345678',
      address: '123 Test St',
      answer: 'Test Answer'
    });
    const res = mockRes();

    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(userModel.prototype, 'save').mockRejectedValueOnce(new Error('DB error'));

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in Registration",
      error: expect.any(Error),
    });
  });

});

/* Update Profile Controller Tests */
describe('updateProfileController unit tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if password is less than 6 characters', async () => {
    const req = {
      user: { _id: 'user-id' },
      body: {
        name: 'Test User',
        email: 'user@example.com',
        password: '123',
        phone: '12345678',
        address: '123 Test St',
      },
    };
    const res = mockRes();

    jest.spyOn(userModel, 'findById').mockResolvedValueOnce({
      _id: 'user-id',
      name: 'Test User',
      password: 'oldpassword',
      phone: '12345678',
      address: '123 Test St',
    });

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: "Password is required and 6 characters long"
    });
  });

  it('should return 400 if findById throws error', async () => {
    const req = {
      user: { _id: 'user-id' },
      body: {
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
        phone: '12345678',
        address: '123 Test St',
      },
    };
    const res = mockRes();

    jest.spyOn(userModel, 'findById').mockRejectedValueOnce(new Error('DB error'));

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error While Update Profile",
      error: expect.any(Error),
    });
  });

  it('should return 200 and updated user on successful update', async () => {
    const req = {
      user: { _id: 'user-id' },
      body: {
        name: 'Updated User',
        email: 'user@example.com',
        password: 'password123',
        phone: '87654321',
        address: '321 Test St',
      },
    };
    const res = mockRes();

    const existingUser = {
      _id: 'user-id',
      name: 'Old User',
      password: 'oldpassword',
      phone: '12345678',
      address: 'Old Address',
    };
    jest.spyOn(userModel, 'findById').mockResolvedValueOnce(existingUser);

    const hashedPassword = await hashPassword('password123');

    const updatedUser = {
      _id: 'user-id',
      name: 'Updated User',
      email: 'user@example.com',
      password: hashedPassword,
      phone: '87654321',
      address: '321 Test St',
    };
    jest.spyOn(userModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedUser);

    await updateProfileController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser: expect.objectContaining({
        _id: 'user-id',
        name: 'Updated User',
        email: 'user@example.com',
        password: hashedPassword,
        phone: '87654321',
        address: '321 Test St',
      }),
    });
  });

});
