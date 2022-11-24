import {
    BelongsTo,
    Column,
    DataType,
    Default, ForeignKey,
    HasMany,
    HasOne,
    Model,
    PrimaryKey,
    Sequelize,
    Table
} from "sequelize-typescript";
import {CreationOptional, InferAttributes, InferCreationAttributes} from "sequelize";
import {beforeEach} from "mocha";
import {expect} from 'chai';

type GearShiftValues =
    'automatic' |
    'manual' |
    'semi-automatic';

const GearShiftType = DataType.STRING(13);

@Table
export class GearShift extends Model<InferAttributes<GearShift>, InferCreationAttributes<GearShift>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(GearShiftType)
    name!: GearShiftValues;

    @HasMany(() => MediumCar)
    cars!: CreationOptional<MediumCar[]>;

    @HasMany(() => MediumDriver)
    drivers!: CreationOptional<MediumDriver[]>;


}

@Table
export class MediumCar extends Model<InferAttributes<MediumCar>, InferCreationAttributes<MediumCar>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(DataType.STRING(120))
    name!: string;

    @BelongsTo(() => GearShift)
    gearShift!: CreationOptional<GearShift>;

    @ForeignKey(() => GearShift)
    @Column(DataType.UUIDV4)
    gearShiftId!: string;


}

@Table
export class MediumDriver extends Model<InferAttributes<MediumDriver>, InferCreationAttributes<MediumDriver>> {

    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column(DataType.UUIDV4)
    id!: CreationOptional<string>;

    @Column(DataType.STRING(120))
    name!: string;

    @BelongsTo(() => GearShift)
    preferredGearShift!: CreationOptional<GearShift>;

    @ForeignKey(() => GearShift)
    @Column(DataType.UUIDV4)
    preferredGearShiftId!: string;

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
            models: [GearShift, MediumCar, MediumDriver]
        });
    });

    beforeEach(async function () {
        await sequelize.drop();
        await sequelize.sync();
    });

    it('every query has to be realized manually', async function () {
        const automatic = await GearShift.create({name: 'automatic'});
        const semiAutomatic = await GearShift.create({name: 'semi-automatic'});
        const manual = await GearShift.create({name: 'manual'});
        await MediumCar.create({name: 'SuperCar1', gearShiftId: automatic.id});
        await MediumCar.create({name: 'SuperCar2', gearShiftId: automatic.id});
        await MediumCar.create({name: 'NiceCar1', gearShiftId: semiAutomatic.id});
        await MediumCar.create({name: 'NiceCar2', gearShiftId: semiAutomatic.id});
        await MediumCar.create({name: 'SimpleCar1', gearShiftId: manual.id});
        await MediumCar.create({name: 'SimpleCar2', gearShiftId: manual.id});

        await MediumDriver.create({name: 'Simple Driver', preferredGearShiftId: manual.id});
        const naivlyLoadedDriver = await MediumDriver.create({name: 'Cool Driver', preferredGearShiftId: automatic.id});

        async function getDriverWithPreferredCars(driverId: string): Promise<MediumDriver | null> {
            return MediumDriver.findOne({
                where: {id: driverId},
                include: [{model: GearShift, include: [{model: MediumCar}]}]
            });
        }

        await naivlyLoadedDriver.reload();
        //Lazy association. Should be empty.
        expect(naivlyLoadedDriver.preferredGearShift).to.not.exist;

        const hydratedDriver = (await getDriverWithPreferredCars(naivlyLoadedDriver.id))!;
        expect(hydratedDriver).to.exist;
        //eagerly loaded assoctiation.
        expect(hydratedDriver!.preferredGearShift).to.exist
        expect(hydratedDriver!.preferredGearShift.cars.length).to.eq(2)

    })


})