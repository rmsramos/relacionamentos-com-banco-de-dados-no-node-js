import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    // Verifica se o cliente existe
    if (!customer) {
      throw new AppError('Customer not found');
    }

    // Cria um array contendo somente os IDs dos produtos como objetos [{ id: 1234-1234-1234-1234 }, ...]
    const productsIdArray = products.map(({ id }) => ({ id }));

    // Cria um array com todos os produtos encontrados a partir dos IDs passados
    const productsArray = await this.productsRepository.findAllById(
      productsIdArray,
    );

    if (products.length !== productsArray.length) {
      throw new AppError('You have informed invalid products');
    }

    productsArray.forEach(product => {
      const productInOrder = products.find(({ id }) => product.id === id);

      if (productInOrder) {
        if (productInOrder.quantity > product.quantity) {
          throw new AppError(
            'You have selected products with insufficient quantities',
          );
        }
      }
    });

    // Cria um array no formato solicitado pelo ICreateOrderDTO -> IProduct
    const formattedArray = productsArray.map(({ id, price }) => ({
      product_id: id,
      price,
      quantity: products.find(product => product.id === id)?.quantity || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: formattedArray,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
