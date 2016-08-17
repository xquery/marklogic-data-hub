import { Component, Input, ViewChild, ViewContainerRef } from '@angular/core';

import { Entity } from '../entities/entity.model';
import { Flow } from '../entities/flow.model';

import { EntitiesService } from '../entities/entities.service';

import { MdlSnackbarService } from 'angular2-mdl';

import { MlcpUi } from '../mlcp-ui/index';
import { NewEntity } from '../new-entity/new-entity';
import { NewFlow } from '../new-flow/new-flow';

import * as _ from 'lodash';

@Component({
  selector: 'home',
  templateUrl: './home.template.html',
  directives: [MlcpUi, NewEntity, NewFlow],
  providers: [],
  styleUrls: ['./home.style.css'],
})
export class Home {
  @ViewChild(MlcpUi) mlcp: MlcpUi;
  @ViewChild(NewEntity) newEntity: NewEntity;
  @ViewChild(NewFlow) newFlow: NewFlow;

  entities: Array<Entity>;
  entity: Entity;
  flow: Flow;
  flowType: string;

  constructor(
    private entitiesService: EntitiesService,
    private snackbar: MdlSnackbarService,
    private vcRef: ViewContainerRef
  ) {
    let vref: any = vcRef;
    snackbar.setDefaultViewContainerRef(vref);
    entitiesService.entityMessageEmitter.subscribe((path: string) => {
      this.getEntities();
    });
    this.getEntities();
  }

  isCollapsed(entity: Entity): boolean {
    let collapsed: string = localStorage.getItem(entity.entityName + '-collapsed');
    if (collapsed === null) {
      collapsed = 'true';
    }
    return collapsed === 'true';
  }

  setCollapsed(entity: Entity, collapsed: boolean): void {
    localStorage.setItem(entity.entityName + '-collapsed', collapsed.toString());
  }

  getEntities(): void {
    this.entitiesService.getEntities().subscribe(entities => {
      this.entities = entities;
    });
  }

  toggleEntity(entity: Entity): void {
    const collapsed: boolean = this.isCollapsed(entity);
    _.each(this.entities, e => { this.setCollapsed(e, true); });
    this.setCollapsed(entity, !collapsed);
  }

  setFlow(entity: Entity, flow: Flow, flowType: string): void {
    if (this.mlcp.isVisible()) {
      this.mlcp.cancel();
    }
    this.entity = entity;
    this.flow = flow;
    this.flowType = flowType;
  }

  isActiveEntity(entity: Entity): boolean {
    return this.entity === entity;
  }

  showNewEntity(ev: Event): void {
    this.newEntity.show().subscribe((newEntity: Entity) => {
      this.entitiesService.createEntity(newEntity).subscribe((entity: Entity) => {
        this.entities.push(entity);
      });
    });
  }

  newInputFlow(ev: Event, entity: Entity): void {
    this.showNewFlow(ev, entity, 'INPUT');
  }

  newHarmonizeFlow(ev: Event, entity: Entity): void {
    this.showNewFlow(ev, entity, 'HARMONIZE');
  }

  showNewFlow(ev: Event, entity: Entity, flowType: string): void {
    this.newFlow.show(flowType).subscribe((newFlow: Flow) => {
      this.entitiesService.createFlow(entity, flowType, newFlow).subscribe((flow: Flow) => {
        if (flowType === 'INPUT') {
          entity.inputFlows.push(flow);
        } else if (flowType === 'HARMONIZE') {
          entity.harmonizeFlows.push(flow);
        }
      });
    });
  }

  runFlow(ev: MouseEvent, flow: Flow, flowType: string) {
    const lower = flowType.toLowerCase();
    if (lower === 'input') {
      this.runInputFlow(ev, flow);
    } else if (lower === 'harmonize') {
      this.runHarmonizeFlow(ev, flow);
    }
  }

  runInputFlow(ev: MouseEvent, flow: Flow): void {
    this.entitiesService.getInputFlowOptions(flow).subscribe(mlcpOptions => {
      this.mlcp.show(mlcpOptions, flow, ev).subscribe((options: any) => {
        this.entitiesService.runInputFlow(flow, options);
        this.snackbar.showSnackbar({
          message: flow.entityName + ': ' + flow.flowName + ' starting...',
        });
      });
    });
    ev.stopPropagation();
  }

  runHarmonizeFlow(ev: Event, flow: Flow): void {
    this.entitiesService.runHarmonizeFlow(flow);
    this.snackbar.showSnackbar({
      message: flow.entityName + ': ' + flow.flowName + ' starting...',
    });
    ev.stopPropagation();
  }
}