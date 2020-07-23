import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create(productData: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create(productData);

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIdsArray = products.map(({ id }) => id);

    const productsArray = await this.ormRepository.find({
      where: {
        id: In(productIdsArray),
      },
    });

    return productsArray;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productIdsArray = products.map(({ id }) => ({ id }));

    const productsToUpdate = await this.findAllById(productIdsArray);

    const productsUpdated = productsToUpdate.map(product => ({
      ...product,
      quantity:
        product.quantity -
        (products.find(({ id }) => product.id === id)?.quantity || 0),
    }));

    const updated = await this.ormRepository.save(productsUpdated);

    return updated;
  }
}

export default ProductsRepository;
