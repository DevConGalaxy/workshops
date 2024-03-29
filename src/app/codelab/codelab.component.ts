import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TutorialService } from '../tutorial.service';

import { MatDialog } from '@angular/material/dialog';

import { ResumeDialogComponent } from './resume-dialog.component';

declare var Konami: any;

@Component({
  selector: 'app-codelab',
  templateUrl: './codelab.component.html',
  styleUrls: ['./codelab.component.scss']
})
export class CodelabComponent implements OnInit {

  public currentStep = 0;
  private tutorialId: string;
  public tutorialDetails: any;
  public steps: Array<any> = new Array<any>();
  private tutorialMd: any;
  public tutorialResources: Array<any> = new Array<any>();
  public authors: Array<any> = new Array<any>();
  public infos: any;
  public tutorialSteps: Array<string> = new Array<string>();
  public mcid = '';
  public ocid = '';
  public konamicode: any;
  public repo: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ts: TutorialService,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
      this.tutorialId = params.get('id');
      // this.mcid = this.route.snapshot.queryParamMap.get('WT.mc_id') || 'javascript-0000-yolasors';
      // this.ocid = this.route.snapshot.queryParamMap.get('ocid') || 'AID3030268';

      this.konamicode = new Konami(`./assets/codelabs/${this.tutorialId}/solution.html`);

      this.route.queryParamMap.subscribe((innerParams: any) => {
        if (!innerParams.has('repo')) {
          console.log("No Repo");
        } else {
          if (!(this.repo === innerParams.get('repo'))) {
            this.repo = innerParams.get('repo');
            
            this.currentStep = 1;
            
            this.getData();
          }

          if (!innerParams.has('step')) {
            const localStorageStep = JSON.parse(
              localStorage.getItem(this.tutorialId)
            );
            if (localStorageStep) {
              this.currentStep = localStorageStep.step;
            } else {
              this.currentStep = 1;
            }

            if (this.currentStep > 1) {
              this.openResumeDialog();
            } else {
              this.updateStepUrl(true);
            }
          } else {
            this.currentStep = Number(innerParams.get('step'));
            if (this.currentStep < 1) {
              this.currentStep = 1;
              this.updateStepUrl(true);
            }
          }
          if (
            this.tutorialSteps.length > 0 &&
            this.currentStep > this.tutorialSteps.length
          ) {
            this.currentStep = this.tutorialSteps.length;
            this.updateStepUrl(true);
          }
        }
      });
    });
  }

  openResumeDialog(): void {

    setTimeout(() => {
      const dialogRef = this.dialog.open(ResumeDialogComponent, {
        width: '350px'
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'restart') {
          this.currentStep = 1;
        }
        this.updateStepUrl(true);
      });
    }, 0);
  }

  getTutorial() {
    let i = 0;
    this.ts.getTutorialMdFromRepo(this.repo).subscribe(response => {
      const path = `https://raw.githubusercontent.com/${this.repo}`;
      this.tutorialMd = response.replace(/media/g, `${path}/images`);
      this.tutorialMd = this.tutorialMd.replace(/WTMCID/g, this.mcid);
      this.tutorialMd = this.tutorialMd.replace(/OCID/g, this.ocid);
      this.tutorialMd.split('--sep--').map(str => {
        let [, title, duration, , ...txt] = str.trim().split('\n');
        title = title.split(':').pop();
        if (i === 0) {
          this.tutorialDetails = {
            title: title.trim()
          };
        } else {
          this.steps.push({
            title: title.trim(),
          });
          this.tutorialSteps.push(txt.join('\n'));
        }
        i++;
      });
      if (this.currentStep > this.tutorialSteps.length) {
        this.currentStep = this.tutorialSteps.length;
        this.updateStepUrl(true);
      }
    });
  }

  getData() {
    this.ts.getTutorialDataFromRepo(this.repo).subscribe((response: any) => {
      console.log(response);

      this.tutorialResources = response.resources || [];
      this.authors = response.authors || [];
      this.infos = response.infos;

      this.mcid = this.route.snapshot.queryParamMap.get('WT.mc_id') || response.tracking.mcid || 'javascript-0000-yolasors';
      this.ocid = this.route.snapshot.queryParamMap.get('ocid') || response.tracking.ocid || 'AID3030268';

      this.updateStepUrl(true);
      this.getTutorial();
    });
  }

  goToStep(step: number) {
    this.currentStep = step;
    this.updateStepUrl();
    this.scrollToTop();
    
    setTimeout(() => {
      (document.querySelector(`#step-${step} .codelab-step > h1`) as HTMLElement).tabIndex = 0;
      (document.querySelector(`#step-${step} .codelab-step > h1`) as HTMLElement)?.focus();
    }, 0); 
  }

  next() {
    this.currentStep++;
    this.updateStepUrl();
    this.scrollToTop();
  }

  prev() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepUrl();
      this.scrollToTop();
    }
  }

  scrollToTop() {
    document.querySelector('.codelab-steps').scrollTo(0, 0);
  }

  updateStepUrl(replaceUrl = false) {
    if (this.tutorialId) {
      localStorage.setItem(this.tutorialId, `{"step":${this.currentStep}}`);
    }
    this.router.navigate([], {
      queryParams: { repo: this.repo, step: this.currentStep, "WT.mc_id": this.mcid, ocid: this.ocid },
      replaceUrl: replaceUrl
    });
  }
}
