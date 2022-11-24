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
export class BetterCar extends Model<InferAttributes<BetterCar>, InferCreationAttributes<BetterCar>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(DataType.STRING(120))
    name!: string;

    @Column(GearShiftType)
    gearShift!: GearShift;

    @HasMany(() => BetterDriver, {foreignKey: 'preferredGearShift', sourceKey: 'gearShift'})
    suitableDriver!: CreationOptional<BetterDriver[]>;

}

@Table
export class BetterDriver extends Model<InferAttributes<BetterDriver>, InferCreationAttributes<BetterDriver>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(DataType.STRING(120))
    name!: string;

    @Column(GearShiftType)
    preferredGearShift!: GearShift;

    @HasMany(() => BetterCar, {foreignKey: 'gearShift', sourceKey: 'preferredGearShift'})
    suitableCar!: CreationOptional<BetterCar[]>;

}


describe('with relation', function () {
    let sequelize!: Sequelize;

    before(async function () {
        sequelize = new Sequelize({
            database: 'test2',
            dialect: 'sqlite',
            username: 'test-user',
            password: '',
            storage: ':memory:',
            //storage: 'db.sqlite',
            logging: (sql, more) => console.log(sql),
            models: [BetterDriver, BetterCar]
        });
    });

    beforeEach(async function () {
        await sequelize.drop();
        await sequelize.sync();
    });

    it('every query has to be realized manually', async function () {
        await BetterCar.create({name: 'SuperCar1', gearShift: 'automatic'});
        await BetterCar.create({name: 'SuperCar2', gearShift: 'automatic'});
        await BetterCar.create({name: 'NiceCar1', gearShift: 'semi-automatic'});
        await BetterCar.create({name: 'NiceCar2', gearShift: 'semi-automatic'});
        await BetterCar.create({name: 'SimpleCar1', gearShift: 'manual'});
        await BetterCar.create({name: 'SimpleCar2', gearShift: 'manual'});

        await BetterDriver.create({name: 'Simple Driver', preferredGearShift: 'manual'});
        const coolDriver = await BetterDriver.create({name: 'Cool Driver', preferredGearShift: 'automatic'});

        async function getDriverWithPreferredCars(driverId: string): Promise<BetterDriver | null> {
            return BetterDriver.findOne({where: {id: driverId}, include: [{model: BetterCar}]});
        }

        const hydratedDriver = await getDriverWithPreferredCars(coolDriver.id);

        expect(hydratedDriver).to.exist;
        expect(hydratedDriver!.suitableCar).to.exist
        expect(hydratedDriver!.suitableCar.length).to.eq(2)

    })


})