import {Column, DataType, Default, HasMany, Model, PrimaryKey, Sequelize, Table} from "sequelize-typescript";
import {CreationOptional, InferAttributes, InferCreationAttributes} from "sequelize";
import {beforeEach} from "mocha";
import {expect} from 'chai';

type GearShift =
    'automatic' |
    'manual' |
    'semi-automatic';

const GearShiftType = DataType.STRING(13);

@Table
export class SimpleCar extends Model<InferAttributes<SimpleCar>, InferCreationAttributes<SimpleCar>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(DataType.STRING(120))
    name!: string;


    @Column(GearShiftType)
    gearShift!: GearShift;


}

@Table
export class SimpleDriver extends Model<InferAttributes<SimpleDriver>, InferCreationAttributes<SimpleDriver>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(DataType.STRING(120))
    name!: string;

    @Column(GearShiftType)
    preferredGearShift!: GearShift;

}

describe('without relation', function () {
    let sequelize!: Sequelize;

    before(async function () {
        sequelize = new Sequelize({
            database: 'test',
            dialect: 'sqlite',
            username: 'test-user',
            password: '',
            storage: ':memory:',
            //storage: 'db.sqlite',
            logging: (sql, more) => console.log(sql),
            models: [SimpleDriver, SimpleCar]
        });
    });

    beforeEach(async function () {
        await sequelize.drop();
        await sequelize.sync();
    });

    it('every query has to be realized manually', async function () {
        const superCar1 = await SimpleCar.create({name: 'SuperCar1', gearShift: 'automatic'});
        const superCar2 = await SimpleCar.create({name: 'SuperCar2', gearShift: 'automatic'});
        await SimpleCar.create({name: 'NiceCar1', gearShift: 'semi-automatic'});
        await SimpleCar.create({name: 'NiceCar2', gearShift: 'semi-automatic'});
        await SimpleCar.create({name: 'SimpleCar1', gearShift: 'manual'});
        await SimpleCar.create({name: 'SimpleCar2', gearShift: 'manual'});

        await SimpleDriver.create({name: 'Simple Driver', preferredGearShift: 'manual'});
        const coolDriver = await SimpleDriver.create({name: 'Cool Driver', preferredGearShift: 'automatic'});

        async function getPreferredCarsForDriver(driver: SimpleDriver): Promise<SimpleCar[]> {
            return SimpleCar.findAll({where: {gearShift: driver.preferredGearShift}});
        }

        const coolDriverCars = (await getPreferredCarsForDriver(coolDriver)).map(car => car.id);

        expect(coolDriverCars.length).to.eq(2);
        expect(coolDriverCars).to.contain(superCar1.id);
        expect(coolDriverCars).to.contain(superCar2.id);

    })


})