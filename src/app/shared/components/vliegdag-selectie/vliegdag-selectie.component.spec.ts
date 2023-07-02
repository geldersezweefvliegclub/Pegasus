import {TestBed} from '@angular/core/testing';
import {NgbDate} from '@ng-bootstrap/ng-bootstrap';
import {VliegdagSelectieComponent} from './vliegdag-selectie.component';

describe('VliegdagSelectieComponent', () => {
    let component: VliegdagSelectieComponent;
    let testDate: NgbDate;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [VliegdagSelectieComponent],
        }).compileComponents();

        const fixture = TestBed.createComponent(VliegdagSelectieComponent);
        component = fixture.componentInstance;

        testDate = new NgbDate(2023, 7, 1);
    });

    it('should return undefined when no condition is true', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(false);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(false);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(false);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBeUndefined();
    });

    it('should return "Daginfo ingevuld" when daginfo is filled', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(false);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(true);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(false);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBe('Daginfo ingevuld');
    });

    it('should return "Vliegdag" when the day is a vliegdag', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(true);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(false);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(false);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBe('Vliegdag');
    });

    it('should return "Ingeroosterd" when user is scheduled for the day', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(false);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(false);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(true);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBe('Ingeroosterd');
    });

    it('should return "Daginfo ingevuld & Vliegdag" when both conditions are true', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(true);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(true);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(false);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBe('Daginfo ingevuld & Vliegdag');
    });

    it('should return "Vliegdag & Ingeroosterd" when both conditions are true', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(true);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(false);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(true);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBe('Vliegdag & Ingeroosterd');
    });

    it('should return "Daginfo ingevuld & Vliegdag & Ingeroosterd" when all conditions are true', () => {
        // Arrange
        spyOn(component, 'isDagVliegdag').and.returnValue(true);
        spyOn(component, 'isDagInfoIngevuldVoorDag').and.returnValue(true);
        spyOn(component, 'isGebruikerIngeroosterdVoorDag').and.returnValue(true);

        // Act
        const tooltip = component.getTooltipText(testDate);

        // Assert
        expect(tooltip).toBe('Daginfo ingevuld & Vliegdag & Ingeroosterd');
    });
});
